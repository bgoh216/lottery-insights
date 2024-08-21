import { Collection, Entity, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { WinningNumbers } from './WinningNumbers.entity.js';
import { WinningShare } from './WinningShare.entity.js';

@Entity()
export class Draw {

    @PrimaryKey()
    draw_no!: number;

    @Property()
    date!: Date;

    @OneToOne(() => WinningNumbers, (winningNumbers) => winningNumbers.draw_no)
    winning_numbers!: WinningNumbers;

    @OneToMany(() => WinningShare, (winningShare) => winningShare.draw)
    winning_shares = new Collection<WinningShare>(this);
}