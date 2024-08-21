import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryKey, Property, Unique } from "@mikro-orm/core";
import { Draw } from "./Draw.entity.js";
import { Address } from "./Address.entity.js";

@Entity()
@Unique({ properties: ['drawNo', 'group'] })
export class WinningShare {
    @PrimaryKey()
    draw_no!: number;

    @PrimaryKey()
    group!: string;

    @Property()
    shareAmount!: number;

    @Property()
    numberOfWinningShares!: number;

    @OneToMany(() => Address, 'address')
    soldAt = new Collection<Address>(this);

    @ManyToOne(() => Draw)
    draw!: Draw;
}