import { Collection, Entity, ManyToMany, Property, Unique } from "@mikro-orm/core";
import { WinningShare } from "./WinningShare.entity.js";

@Entity()
@Unique({ properties: ['drawNo', 'group'] })
export class Address {
    @Property()
    drawNo!: number;

    @Property()
    group!: string;

    @Property()
    address!: string;

    @ManyToMany(() => WinningShare, 'soldAt')
    winningShares = new Collection<WinningShare>(this);
}